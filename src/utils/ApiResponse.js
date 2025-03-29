class ApiResponse {
    constructor(message,data,statusCode='success') {
        this.message = message
        this.data = data
        this.statusCode = statusCode
    }
}

export {ApiResponse}