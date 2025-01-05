import { getWixContent } from "@/actions/workspace";
import React from "react";

const Home = async () => {
  const video = await getWixContent();
  return <div>Home</div>;
};

export default Home;
