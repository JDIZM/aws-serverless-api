import type { Handler, APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";


// Lambda http handler
// https://docs.aws.amazon.com/lambda/latest/dg/typescript-handler.html
export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> = async (_event) => {
  const url = 'https:/jsonplaceholder.typicode.com/todos';
  try {
        // fetch is available with Node.js 18
        const res = await fetch(url);
        return {
            statusCode: res.status,
            body: JSON.stringify({
                message: 'hello world',
                todos: await res.json(),
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
}