import { Resource } from "@daemon-land/types";
import { Box, Text, Glyph, Title } from "@glif/react-components";
import PropTypes from "prop-types";
import { ResourcePropType } from "../../../PropTypes";

export default function CardHeader(props: {
    // from: string;
    // permission: number;
    // resource: Resource;
}) {
    return (
        <Box
            width="100%"
            p={3}
            border={0}
            borderTopRightRadius={3}
            borderTopLeftRadius={3}
            bg="core.primary"
            color="core.white"
        >
            <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
            >
                <Box display="flex" flexDirection="row" alignItems="center">
                    <Glyph acronym="Rv" color="white" mr={3} />
                    <Box display="flex" flexDirection="column" alignItems="flex-start">
                        <Text m={0}>Review request</Text>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
