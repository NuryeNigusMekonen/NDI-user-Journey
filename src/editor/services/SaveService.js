import { SAVE_CODE } from '../constants';
import { BoardService } from './BoardService';

export const SaveService = {
  validateCode(code) {
    return code === SAVE_CODE;
  },

  async persist(journeyId, boardState, code, savedBy) {
    if (!this.validateCode(code)) {
      throw new Error('Invalid confirmation code');
    }
    return BoardService.save(journeyId, boardState, savedBy);
  },
};
