import { createConsumer } from "@rails/actioncable";

const cable = createConsumer("ws://localhost:3000/cable"); // Adjust if hosted

export default cable;
