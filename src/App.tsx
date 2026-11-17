/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DesktopWorkspace } from './components/os/DesktopWorkspace';
import { OSProvider } from './os/OSContext';

export default function App() {
  return (
    <OSProvider>
      <DesktopWorkspace />
    </OSProvider>
  );
}
