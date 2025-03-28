class ApiResponse extends Response {
    constructor(message,data,statusCode='success') {
        this.message = message
        this.data = data
        this.statusCode = statusCode
        thi.success = statusCode < 400
    }
}

export {ApiResponse}