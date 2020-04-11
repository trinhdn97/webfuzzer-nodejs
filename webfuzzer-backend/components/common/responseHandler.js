export const response = (res, result, error) => {
    res.status(error ? (error.httpCode || 400) : (result ? result.httpCode || 200 : 404))
       .send({ 'error': error, 'results': result });
}