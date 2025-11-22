const DB_NAME = "buddyScript";
enum Visibility{
    PUBLIC = 'public',
    PRIVATE = 'private'
}

enum likeTargetType {
    POST = 'post',
    COMMENT = 'comment'
}

export {
    DB_NAME,
    Visibility,
    likeTargetType
}