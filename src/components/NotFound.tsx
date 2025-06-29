import LinkTo from "./LinkTo";
import { AlertCircle } from "lucide-react";

const NotFound = () => {
  return (
    <>
      <title>Drug Wise - 404</title>
      <div className="w-full min-h-1/2 flex flex-col gap-6 py-4 items-center justify-center  text-white my-20">
        <AlertCircle className="w-16 h-16 text-red-500 animate-bounce" />
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent">
          Not Found
        </h1>
        <p className="w-[300px] md:w-full text-center text-gray-300">
          Oh no! The page you are looking for does not exist.
        </p>
        <LinkTo url="/" variant="danger" className="mt-4">
          Go Home
        </LinkTo>
      </div>
    </>
  );
};

export default NotFound;