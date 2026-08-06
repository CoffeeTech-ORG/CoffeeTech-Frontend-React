import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHubDetail } from '../../../hooks/useHubDetail';
import { farmsService } from '../../../services/farms.service';
import { useHubsOutlet } from '../SensorInventory';
import { HubDetail } from './HubDetail';

/**
 * `/hubs/:hubId` -- the panel, mounted in the list's `Outlet`. Visually the sliding panel, but a
 * real URL underneath, which a memory state does not give: reloading reopens the panel, a specific
 * hub's link can be shared, and the browser back button closes it instead of leaving Hubs.
 *
 * This route does NOT draw the list. It is a child of `/hubs`, so the list survives navigation and
 * only the hub is resolved here.
 */
export const HubDetailRoute: React.FC = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const navigate = useNavigate();
  const { refresh } = useHubsOutlet();
  const { hub, history, freeSections, cadenceMs, loading, reload } = useHubDetail(hubId);

  // A non-existent id leaves the list as-is: there is no error screen to show when what fails is a
  // layer over something that is there. And nothing is drawn while loading: the list is already
  // there, and a panel skeleton in front would announce an empty layer.
  if (loading || !hub) return null;

  /** Refreshes both: the panel for its own content, and the list behind. */
  const reloadBoth = async () => {
    await reload();
    await refresh();
  };

  return (
    <HubDetail
      hub={hub}
      history={history}
      freeSections={freeSections}
      cadenceMs={cadenceMs}
      onClose={() => navigate('/hubs')}
      onAssign={async (sectionId) => {
        // Moving a hub closes its period and opens another, not rewrites the row, so earlier
        // readings keep belonging to the plot they were taken in. That is why it is removed first.
        if (hub.assignmentId != null) {
          await farmsService.removeAssignment(hub.assignmentId);
        }
        await farmsService.createAssignment(sectionId, hub.id);
        await reloadBoth();
      }}
      onRemove={async () => {
        if (hub.assignmentId == null) return;
        await farmsService.removeAssignment(hub.assignmentId);
        await reloadBoth();
      }}
    />
  );
};
