import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

// import { experiences } from "../data";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { textVariant } from "../utils/motion";
import MansoryPhotoAlbum from "./MansoryPhotoAlbum";
import photos from "../assets/photos/photos.ts";
import { MasonryPhotoAlbum } from "react-photo-album";

const Experience = () => {
  return (
    <div className="sm:my-20">
      <motion.div variants={textVariant()}>
        <h2 className={`${styles.sectionText} text-center`}>ALBUM</h2>
      </motion.div>

      <div className="relative mt-10 md:mt-20 md:p-20 flex flex-col items-center sm:flex-row sm:items-start">
        cai doan nay bi loi~ em dung luot xuong nua =)))))
        {/* <MansoryPhotoAlbum photos={photos} />*/}
        <MasonryPhotoAlbum
          photos={photos?.map((page) => page.data?.items).flat(Infinity) || []}
          layout="masonry"
          spacing={10}
          columns={(containerWidth) => {
            return containerWidth / 160;
          }}
          render={{
            image: (props, context) =>
              WrapperComponent(
                props,
                context,
                isModal,
                refetch,
                handleOnClickImage,
                imageSelected.find((i) => i.url === props.src) ? true : false
              ),
          }}
        />
      </div>
    </div>
  );
};

export default SectionWrapper(Experience, "portfolio");
