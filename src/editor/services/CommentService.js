import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const memoryThreads = new Map();

function mapReply(row) {
  return {
    id: row.id,
    author: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapThread(thread, replies = []) {
  return {
    id: thread.id,
    x: thread.x,
    y: thread.y,
    nodeId: thread.node_id,
    resolved: thread.resolved,
    createdAt: thread.created_at,
    replies: replies.map(mapReply).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  };
}


export const CommentService = {
  createLocalReply(authorName, body) {
    return {
      id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author: authorName,
      body,
      createdAt: new Date().toISOString(),
    };
  },

  async fetchByJourney(journeyId) {
    if (!isSupabaseConfigured) {
      return memoryThreads.get(journeyId) || [];
    }

    const { data: threads, error: threadError } = await supabase
      .from('comment_threads')
      .select('*')
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: true });

    if (threadError) throw threadError;
    if (!threads?.length) return [];

    const threadIds = threads.map((t) => t.id);
    const { data: replies, error: replyError } = await supabase
      .from('comment_replies')
      .select('*')
      .in('thread_id', threadIds)
      .order('created_at', { ascending: true });

    if (replyError) throw replyError;

    const repliesByThread = {};
    for (const reply of replies || []) {
      (repliesByThread[reply.thread_id] ||= []).push(reply);
    }

    return threads.map((t) => mapThread(t, repliesByThread[t.id]));
  },

  async createThread(journeyId, x, y, authorName, body = '') {
    if (!isSupabaseConfigured) {
      const thread = {
        id: `thread-${Date.now()}`,
        x,
        y,
        resolved: false,
        replies: body ? [this.createLocalReply(authorName, body)] : [],
        createdAt: new Date().toISOString(),
      };
      const list = memoryThreads.get(journeyId) || [];
      list.push(thread);
      memoryThreads.set(journeyId, list);
      return thread;
    }

    const { data: thread, error } = await supabase
      .from('comment_threads')
      .insert({ journey_id: journeyId, x, y })
      .select()
      .single();

    if (error) throw error;

    const replies = [];
    if (body?.trim()) {
      replies.push(await this.addReply(thread.id, authorName, body));
    }

    return mapThread(thread, replies.map((r) => ({
      id: r.id,
      author_name: r.author,
      body: r.body,
      created_at: r.createdAt,
    })));
  },

  async addReply(threadId, authorName, body) {
    if (!isSupabaseConfigured) {
      const reply = this.createLocalReply(authorName, body);
      for (const [, threads] of memoryThreads) {
        const thread = threads.find((t) => t.id === threadId);
        if (thread) {
          thread.replies.push(reply);
          break;
        }
      }
      return reply;
    }

    const { data, error } = await supabase
      .from('comment_replies')
      .insert({ thread_id: threadId, author_name: authorName, body })
      .select()
      .single();

    if (error) throw error;
    return mapReply(data);
  },

  async setResolved(threadId, resolved) {
    if (!isSupabaseConfigured) {
      for (const [, threads] of memoryThreads) {
        const thread = threads.find((t) => t.id === threadId);
        if (thread) {
          thread.resolved = resolved;
          break;
        }
      }
      return;
    }

    const { error } = await supabase
      .from('comment_threads')
      .update({ resolved })
      .eq('id', threadId);

    if (error) throw error;
  },

  async deleteThread(threadId) {
    if (!isSupabaseConfigured) {
      for (const [journeyId, threads] of memoryThreads) {
        memoryThreads.set(journeyId, threads.filter((t) => t.id !== threadId));
      }
      return;
    }

    const { error } = await supabase
      .from('comment_threads')
      .delete()
      .eq('id', threadId);

    if (error) throw error;
  },

  subscribe(journeyId, onChange) {
    if (!isSupabaseConfigured) return () => {};

    const channel = supabase
      .channel(`comments:${journeyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_threads',
          filter: `journey_id=eq.${journeyId}`,
        },
        () => onChange(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_replies',
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
