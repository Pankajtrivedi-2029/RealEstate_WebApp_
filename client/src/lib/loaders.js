import { defer } from "react-router-dom";
import apiRequest from "./apiRequest";

// Loader for a single post
export const singlePageLoader = async ({ request, params }) => {
  try {
    const res = await apiRequest("/posts/" + params.id);
    return res.data; // Assuming the response data is what you need directly
  } catch (error) {
    console.error("Error fetching single post:", error);
    throw new Error("Failed to load post");
  }
};

// Loader for the list page with query params
export const listPageLoader = async ({ request, params }) => {
  try {
    // Use URLSearchParams to handle query parameters
    const query = new URL(request.url).searchParams.toString(); // Safer and more readable
    const postPromise = apiRequest("/posts?" + query);

    return defer({
      postResponse: postPromise, // Deferring the API call for the list page
    });
  } catch (error) {
    console.error("Error fetching posts list:", error);
    throw new Error("Failed to load posts list");
  }
};

// Loader for the profile page
export const profilePageLoader = async () => {
  try {
    const postPromise = apiRequest("/users/profilePosts");
    const chatPromise = apiRequest("/chats");

    return defer({
      postResponse: postPromise, // Deferring both the post and chat responses
      chatResponse: chatPromise,
    });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw new Error("Failed to load profile data");
  }
};
