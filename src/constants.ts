const DB_NAME = "buddyScript";
enum Visibility {
    PUBLIC = 'public',
    PRIVATE = 'private'
}

enum likeTargetType {
    POST = 'post',
    COMMENT = 'comment'
}

enum ReactionType {
    LIKE = 'like',
    LOVE = 'love',
    HAHA = 'haha',
    CARE = 'care',
    ANGRY = 'angry'
}
const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg", "image/avif"];
const allowedExt = [".jpeg", ".jpg", ".png", ".gif", ".webp", ".svg", ".avif"];
const fileSizeLimit = 10 * 1024 * 1024;

export {
    DB_NAME,
    Visibility,
    likeTargetType,
    ReactionType,
    allowedMimeTypes,
    allowedExt,
    fileSizeLimit
}