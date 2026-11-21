import { notifications } from '@mantine/notifications';

// Sticky save-failure toast, shared by the create page and the collection
// item page's autosave. A shared notification id keeps repeated failures
// updating ONE toast instead of stacking; dismissed on the next successful
// save. 401s are skipped — the session-expiry bounce covers those.
export const notifySaveFailure = (err) => {
    const status = err?.response?.status;
    if (status === 401) return;
    const unreachable = !status || status >= 500;
    notifications.show({
        id: "numistag-save-error",
        title: "Not saved",
        color: "red",
        autoClose: false,
        message: unreachable
            ? "Can't reach the server — your edits are NOT being saved. They'll go through once the connection is back."
            : `Save failed (server error ${status}). Your edits stay on this page until a save succeeds.`,
    });
};

export const clearSaveFailureToast = () => notifications.hide("numistag-save-error");
