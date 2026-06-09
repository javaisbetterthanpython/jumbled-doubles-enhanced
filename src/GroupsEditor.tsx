import {
  Button,
  Checkbox,
  Input,
  Spacer,
  Switch,
} from "@nextui-org/react";
import { useState } from "react";
import { AddUser, ArrowDown, ArrowUp, Delete } from "react-iconly";
import { PlayerId } from "./matching/heuristics";
import {
  addGroup,
  createEnabledGroupsState,
  GroupsState,
  isSwingPlayer,
  reorderGroups,
  removeGroup,
  renameGroup,
  togglePlayerGroup,
} from "./groups";

type PlayerRow = { id: PlayerId; name: string };

export function GroupsEditor({
  groupsState,
  onChange,
  players,
  showEnableToggle = false,
  enableToggleLabel = "Enable skill groups",
  midSessionNote,
}: {
  groupsState: GroupsState;
  onChange: (next: GroupsState) => void;
  players: PlayerRow[];
  showEnableToggle?: boolean;
  enableToggleLabel?: string;
  midSessionNote?: string;
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const activePlayerIds = players.map((p) => p.id);

  const handleEnableChange = (enabled: boolean) => {
    if (!enabled) {
      onChange({ ...groupsState, enabled: false });
      return;
    }
    onChange(createEnabledGroupsState(activePlayerIds));
  };

  const handleAddGroup = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    onChange({
      ...groupsState,
      groups: addGroup(groupsState.groups, trimmed),
    });
    setNewGroupName("");
  };

  const handleDrop = (toIndex: number) => {
    if (dragIndex === null || dragIndex === toIndex) return;
    onChange({
      ...groupsState,
      groups: reorderGroups(groupsState.groups, dragIndex, toIndex),
    });
    setDragIndex(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {showEnableToggle ? (
        <label>
          <div className="flex gap-2 items-center">
            <span>{enableToggleLabel}</span>
            <Spacer className="flex-1" />
            <Switch
              isSelected={groupsState.enabled}
              onValueChange={handleEnableChange}
            />
          </div>
          {midSessionNote && groupsState.enabled ? (
            <p className="text-sm text-default-500 mt-1">{midSessionNote}</p>
          ) : null}
        </label>
      ) : null}

      {groupsState.enabled ? (
        <>
          <div>
            <p className="text-sm font-semibold mb-1">
              Skill groups{" "}
              <span className="font-normal text-default-500">
                (drag to set priority — top = highest skill)
              </span>
            </p>
            <ul className="flex flex-col gap-1">
              {groupsState.groups.map((group, index) => (
                <li
                  key={group.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={() => setDragIndex(null)}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${
                    dragIndex === index ? "border-primary bg-primary-50" : ""
                  }`}
                >
                  <span className="text-default-400 cursor-grab select-none">
                    ⋮⋮
                  </span>
                  <Input
                    size="sm"
                    variant="bordered"
                    value={group.name}
                    aria-label={`Group name ${index + 1}`}
                    className="flex-1"
                    onChange={(e) =>
                      onChange({
                        ...groupsState,
                        groups: renameGroup(
                          groupsState.groups,
                          group.id,
                          e.target.value
                        ),
                      })
                    }
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    aria-label={`Move ${group.name} up`}
                    isDisabled={index === 0}
                    onPress={() =>
                      onChange({
                        ...groupsState,
                        groups: reorderGroups(
                          groupsState.groups,
                          index,
                          index - 1
                        ),
                      })
                    }
                  >
                    <ArrowUp size="small" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    aria-label={`Move ${group.name} down`}
                    isDisabled={index === groupsState.groups.length - 1}
                    onPress={() =>
                      onChange({
                        ...groupsState,
                        groups: reorderGroups(
                          groupsState.groups,
                          index,
                          index + 1
                        ),
                      })
                    }
                  >
                    <ArrowDown size="small" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    color="danger"
                    aria-label={`Remove group ${group.name}`}
                    isDisabled={groupsState.groups.length <= 1}
                    onPress={() =>
                      onChange(
                        removeGroup(groupsState, group.id, activePlayerIds)
                      )
                    }
                  >
                    <Delete size="small" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 items-end mt-2">
              <Input
                size="sm"
                variant="bordered"
                label="New group"
                labelPlacement="outside"
                placeholder="e.g. Intermediate"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddGroup();
                  }
                }}
              />
              <Button
                color="primary"
                isIconOnly
                aria-label="Add group"
                onPress={handleAddGroup}
              >
                <AddUser />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-1">Player groups</p>
            {players.length === 0 ? (
              <p className="text-sm text-default-500">Add players first.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {players.map((player) => {
                  const swing = isSwingPlayer(player.id, groupsState);
                  return (
                    <div
                      key={player.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-2"
                    >
                      <span className="min-w-[6rem] font-medium">
                        {swing ? (
                          <span title="Swing player (multiple groups)">⚠️ </span>
                        ) : null}
                        {player.name}
                      </span>
                      {groupsState.groups.map((group) => {
                        const checked = (
                          groupsState.playerGroups[player.id] ?? []
                        ).includes(group.id);
                        return (
                          <Checkbox
                            key={group.id}
                            size="sm"
                            isSelected={checked}
                            onValueChange={() =>
                              onChange(
                                togglePlayerGroup(
                                  groupsState,
                                  player.id,
                                  group.id
                                )
                              )
                            }
                          >
                            {group.name}
                          </Checkbox>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
