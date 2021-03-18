import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Text } from "@glif/react-components";

export default function MyDropzone(props: {
  fileCB: (res: string | ArrayBuffer | null) => void;
}) {
  const onDrop = useCallback(
    ([file]) => {
      const reader = new FileReader();
      reader.onload = () => {
        props.fileCB(reader.result);
      };
      reader.readAsArrayBuffer(file);
    },
    [props.fileCB]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <Box border="1px black dotted" mt={4} bg="input.background.base">
          <Text p={2} textAlign="center">
            Drop em'
          </Text>
        </Box>
      ) : (
        <Box border="1px black dotted" mt={4}>
          <Text p={2} textAlign="center">
            Drag 'n' drop an application image here, or click to select files
          </Text>
        </Box>
      )}
    </div>
  );
}
