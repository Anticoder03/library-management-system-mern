import { Router } from 'express';
import {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  getMemberHistory,
} from '../controllers/memberController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  memberValidator,
  memberUpdateValidator,
  memberIdValidator,
} from '../validators/memberValidator.js';
import { memberParamValidator } from '../validators/miscValidator.js';

const router = Router();
router.use(protect, authorize('admin', 'librarian'));

router.get('/', getMembers);
router.post('/', memberValidator, validate, createMember);
router.get('/:id', memberIdValidator, validate, getMember);
router.put('/:id', memberUpdateValidator, validate, updateMember);
router.delete('/:id', memberIdValidator, validate, deleteMember);
router.get('/:memberId/history', memberParamValidator, validate, getMemberHistory);

export default router;
