import LinkTo from "./LinkTo";

const NotFound = () => {
  return (
    <>
      <title>Drug Wise - 404</title>
      <div className="w-full h-full flex flex-col gap-5 py-4  min-h-10 items-center justify-center">
        <h1 className="text-5xl text-left font-bold ">Not Found</h1>
        <p className=" w-[300px] md:w-full text-center">
          Oh no! The page you are looking for does not exist.
        </p>
        <LinkTo url="/" variant="ghost">
          Go Home
        </LinkTo>
      </div>
    </>
  );
};

export default NotFound;
