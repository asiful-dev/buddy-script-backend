export class AppResponse {
    public readonly statusCode: number
    public readonly data: any
    public readonly message: string
    public readonly success: boolean
    constructor(
        statusCode: number,
        message = "Success",
        data: any,

    ) {
        this.statusCode = statusCode
        this.message = message
        this.data = data
        this.success = statusCode < 400
    }
};
