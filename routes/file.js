import express from "express";
import multer from 'multer';
import { UploadAvatarGroup } from "../controllers/file.js";
import { UploadAvatar } from "../controllers/file.js";
import { UploadFile } from "../controllers/file.js";
import { SetupNewAvatar } from "../controllers/file.js";
import { SetupNewAvatarGroup } from "../controllers/file.js";
import { DownLoadAvatar } from "../controllers/file.js";
import { DownloadAvatarGroup } from "../controllers/file.js";
import { uploadfiles } from "../controllers/file.js";
const router = express.Router();
const storage = multer.memoryStorage()
const upload = multer({storage});

router.post('/UploadAvatarGroup', upload.single('avatarConversation'), UploadAvatarGroup)
router.post('/UploadAvatar', upload.single('avatarUser'), UploadAvatar)
router.post('/UploadFile', uploadfiles.array('files'), UploadFile)
router.get('/SetupNewAvatar', SetupNewAvatar)
router.get('/SetupNewAvatarGroup', SetupNewAvatarGroup)
router.get('/DownLoadAvatar/:fileName', DownLoadAvatar)
router.get('/DownloadAvatarGroup/:fileName', DownloadAvatarGroup)

export default router