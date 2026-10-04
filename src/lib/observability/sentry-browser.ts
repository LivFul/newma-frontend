// The only Sentry browser exports the client uses. Importing this module (not the package namespace)
// lets the bundler drop the rest of the SDK, such as Replay and Feedback, from the lazy chunk.
export { captureException, captureRouterTransitionStart, init } from "@sentry/nextjs";
