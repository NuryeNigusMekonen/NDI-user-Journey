-- Force every journey to re-lay out from code (vertically).
--
-- Why: loadJourneyBoard() returns early with source:'saved' whenever a board row exists, so the
-- stored node positions win and the code's layout direction is never applied. The boards were laid
-- out when layoutWithElk still defaulted to 'right', which is why journeys render as one ~6,270px
-- horizontal line even after the code was switched to 'down'.
--
-- Deleting the board rows cascades to nodes/edges (and to comments/annotations — see the caution
-- below). With no saved board, the next load rebuilds the graph and lays it out vertically.
--
-- ⚠️ CAUTION — read before running:
--   * Any MANUAL repositioning of nodes is lost. That is the point: the manual positions are the
--     horizontal ones being replaced.
--   * comments and annotations are anchored by x/y (not node id) and cascade-delete with the board.
--     If you want to keep them, back them up FIRST:
--        create table comments_backup   as select * from public.comments;
--        create table annotations_backup as select * from public.annotations;
--     Note they would land in the wrong place after a re-layout anyway, since their coordinates
--     point at where the old horizontal nodes used to be.

-- Inspect before deleting:
--   select b.id, b.journey_id,
--          (select count(*) from public.nodes       n where n.board_id = b.id) as nodes,
--          (select count(*) from public.comments    c where c.board_id = b.id) as comments,
--          (select count(*) from public.annotations a where a.board_id = b.id) as annotations
--     from public.boards b order by b.journey_id;

delete from public.boards;
