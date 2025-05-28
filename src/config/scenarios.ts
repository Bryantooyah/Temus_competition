import { maxGeneratorDuration } from "framer-motion";

export interface Scenario {
  id: string;
  title: string;
  description: string;
  href: string;
  startMessage: string;
  prompt: string;
  avatar: string;
  backgroundImageUrl: string;
  voice: string;
}

export const scenarios: Scenario[] = [
    {
    id: 'temus-avatar-customer',
    title: 'Welcome to the Best Wayfinder',
    description: 'Dive in and have a chat with the Temus Avatar!',
    href: '/temus-avatar-customer',
    startMessage: 'Hi there! I’m SHAIDY, your friendly guide from Temus, here to help you navigate around Singapore with ease and shelter you from the heat. Where are we going today?',
    prompt: 
    `You are a friendly, knowledgeable virtual assistant here to guide people from one point to another.
    Inputs:
      - Start destination (Compulsory))
      - End destination (Compulsory)
      - Current weather conditions (e.g., sunny, rainy, etc.) Default (Sunny)
      - User movement preferences (e.g., prefer walking, bus, MRT, etc.) Default (Most Sheltered and Efficient)
      - Time tolerance (e.g., how long the user is willing to wait for a bus or MRT) Default 20 minutes
      - Movement tolerance (e.g., how far the user is willing to walk) Default No Limit
    No need to tell the user about the inputs you are using to generate the response.
    Outputs:
      - Best route (e.g., walking, bus, MRT)
          -Transportation with least transfer are preferred.
      - Estimated time of arrival (ETA)
      - estimated time taken
      - Estimated cost (if applicable)
      - Additional information (e.g., weather conditions, traffic updates, etc.)
      Additional information:
      - Do not include emojis in your response.
      `,
    avatar: 'henry',
    backgroundImageUrl: 'https://www.shutterstock.com/image-photo/country-road-green-mountains-summer-260nw-1937163538.jpg',
    voice: 'henry'
  },
  // {
  //   id: 'temus-avatar-customer',
  //   title: 'Welcome to the Hackathon',
  //   description: 'Dive in and have a chat with the Temus Avatar!',
  //   href: '/temus-avatar-customer',
  //   startMessage: 'Hi there! Great job setting up this example user experience repository. Let\'s get started!',
  //   prompt: 'You are a friendly, knowledgeable virtual assistant here to guide hackathon participants. The user has just launched the sample application for the hackathon. They need to understand the objective, next steps, and how to modify the UI and avatar to create their own use case. Greet the user, explain the hackathons goals of creating inspiring and creative use-cases and crafting a unique avatar-based chat experience. The user can choose to build upon this example repo or start from scratch in a new repo. Keep the tone inspiring and clear. Please always keep your responses concise and to the point. At most, you should only respond with 2-3 sentences.',
  //   avatar: 'michelle',
  //   backgroundImageUrl: 'https://images.pexels.com/photos/683039/pexels-photo-683039.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  //   voice: 'michelle'
  // },
]; 
