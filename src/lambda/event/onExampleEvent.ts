
import type { EventBridgeHandler } from "aws-lambda";

interface ExampleEvent {
  url: string
}

// Example event handler
export const handler: EventBridgeHandler<"ExampleEventName", ExampleEvent, void> = async (_event) => {
  try {
        // fetch is available with Node.js 18
        // const url = 'https:/jsonplaceholder.typicode.com/todos';
        if (!_event.detail.url) {
          throw new Error("url is required");
        }

        const res = await fetch(_event.detail.url);
        const todos = await res.json();

        console.log(JSON.stringify(todos, null, 2));
    } catch (err) {
        console.log(err);
    }
}