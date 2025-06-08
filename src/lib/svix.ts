import { Svix } from "svix";

const svix = new Svix("AUTH_TOKEN");
const app = await svix.application.create({
  name: "veerath news",
  uid: "testsk_-j8HG4gQW8dztIk18dKFGoJglWbF5omN.eu"
});