import { Router } from 'express';
import {
  deleteDocument,
  downloadFile,
  getDocument,
  getDocuments,
  getStats,
  reprocessDocument,
  updateDocument,
  uploadDocument,
} from '../controllers/documentController';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
router.use(protect); // every document route needs a logged-in user

router.route('/').get(getDocuments).post(upload.single('file'), uploadDocument);
router.get('/stats', getStats); // keep above '/:id'
router.route('/:id').get(getDocument).put(updateDocument).delete(deleteDocument);
router.get('/:id/file', downloadFile);
router.post('/:id/reprocess', reprocessDocument);

export default router;
