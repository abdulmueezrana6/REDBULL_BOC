import React from "react";
import ImportStaticHTML from "./ImportStaticHTMLComponent"; 

interface MetaRandomWrapperProps {
  src: string;
  forceReloadCSS?: boolean;
}
const MetaRandomWrapper: React.FC<MetaRandomWrapperProps> = ({ src, forceReloadCSS = true }) => {
  return (
    <>
      <ImportStaticHTML
        src={src}
        method="fetch"
        forceReloadCSS={forceReloadCSS}
        className="div-container"
      />
    </>
  );
};
export default MetaRandomWrapper;
