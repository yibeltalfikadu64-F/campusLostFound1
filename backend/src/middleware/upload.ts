import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { BadRequestError } from "../errors/AppError";

const uploadDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },

  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

    callback(null, `item-${uniqueSuffix}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (!allowedMimes.has(file.mimetype)) {
    callback(
      new BadRequestError(
        "Only image files (JPEG, PNG, WebP, GIF) are allowed",
      ),
    );
    return;
  }

  callback(null, true);
};

export const uploadImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3,
  },
  fileFilter,
});
