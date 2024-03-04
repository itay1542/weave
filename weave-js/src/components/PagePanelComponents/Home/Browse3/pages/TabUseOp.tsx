import {Alert, Box} from '@mui/material';
import React from 'react';

import {isValidVarName} from '../../../../../core/util/var';
import {CopyableText} from '../../../../CopyableText';
import {DocLink} from './common/Links';

type TabUseOpProps = {
  name: string;
  uri: string;
};

export const TabUseOp = ({name, uri}: TabUseOpProps) => {
  const pythonName = isValidVarName(name) ? name : 'op';

  return (
    <Box m={2}>
      <Alert severity="info" variant="outlined">
        See{' '}
        <DocLink
          path="guides/tracking/objects#getting-an-object-back"
          text="Weave docs on refs"
        />{' '}
        for more information.
      </Alert>

      <Box mt={2}>
        The ref for this operation version is:
        <CopyableText text={uri} />
      </Box>
      <Box mt={2}>
        Use the following code to retrieve this operation version:
        <CopyableText
          text={`${pythonName} = weave.ref(<ref_url>).get()`}
          copyText={`${pythonName} = weave.ref("${uri}").get()`}
        />
      </Box>
    </Box>
  );
};
