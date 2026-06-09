import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { GroupsEditor } from "./GroupsEditor";
import {
  allPlayersHaveGroup,
  GroupsState,
  GroupPlayMode,
  levelFixedPairsForGroups,
  normalizeGroupsState,
  sanitizePlayerGroups,
} from "./groups";
import { useShufflerState } from "./useShuffler";

export function GroupsModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (groups: GroupsState) => void;
}) {
  const state = useShufflerState();
  const [groupsState, setGroupsState] = useState<GroupsState>(
    defaultFromState(state.groups)
  );

  const players = state.players
    .map((id) => ({
      id,
      name: state.playersById[id]?.name ?? "",
    }))
    .filter((p) => p.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (open) {
      setGroupsState(defaultFromState(state.groups));
    }
  }, [open, state.groups]);

  const handleSubmit = () => {
    let next = groupsState;
    if (next.enabled) {
      next = sanitizePlayerGroups(next, state.players);
      next = levelFixedPairsForGroups(state.fixedPairs, next);
    }
    if (!allPlayersHaveGroup(next, state.players)) return;
    onSubmit(next);
  };

  return (
    <Modal
      closeButton
      aria-labelledby="groups-modal-title"
      isOpen={open}
      scrollBehavior="inside"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader>
          <h3 id="groups-modal-title">Skill groups</h3>
        </ModalHeader>
        <ModalBody>
          <GroupsEditor
            groupsState={groupsState}
            onChange={setGroupsState}
            players={players}
            showEnableToggle
            midSessionNote="Changes apply from the next round onward. Past rounds are unchanged."
          />
          {groupsState.enabled ? (
            <label className="mt-2 block">
              <p className="text-sm font-semibold mb-1">Default play mode</p>
              <Select
                aria-label="Default play mode for new rounds"
                selectedKeys={[groupsState.playMode]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as
                    | GroupPlayMode
                    | undefined;
                  if (!selected) return;
                  setGroupsState({ ...groupsState, playMode: selected });
                }}
              >
                <SelectItem key="separate" value="separate">
                  Separate groups
                </SelectItem>
                <SelectItem key="combined" value="combined">
                  Combined groups
                </SelectItem>
              </Select>
            </label>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isDisabled={
              groupsState.enabled &&
              !allPlayersHaveGroup(groupsState, state.players)
            }
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function defaultFromState(groups: GroupsState | undefined): GroupsState {
  return normalizeGroupsState(groups);
}
