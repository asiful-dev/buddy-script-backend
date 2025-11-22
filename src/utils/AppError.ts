export class AppError extends Error {
    public readonly statusCode: number;
    public readonly message: string = "Something went wrong";
    public readonly isOperational: boolean;
    public readonly details?: any;
    public readonly stack?: string;

    constructor(
        statusCode: number,
        message: string,
        isOperational = true,
        details?: any,
        stack?: string
    ) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = isOperational;
        this.details = details;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
};
