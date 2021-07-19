import React from "react";
import FormInput from "../shared/FormInput";
import TagsInput from "../shared/TagsInput";
import { Button } from "react-bootstrap";
import StaticTags from "../StaticTags";
import Log from "../shared/logger";
import {
  MemberIpIcon,
  MemberMonitorIcon,
  MemberRequiredField,
} from "./MemberIpIcons";
import CopyPastePopover from "../shared/CopyPastePopover";

const NewMemberListItem = ({ member, index, onRemoveMember, results }) => {
  const onRemoveClick = (e) => {
    onRemoveMember(member.id);
  };

  const shouldAlert = () => {
    if (results) {
      return results.saved == false;
    }
    return false;
  };

  const displayName = () => {
    return (
      <CopyPastePopover
        text={member.name}
        size={20}
        sliceType="MIDDLE"
        shouldCopy={false}
      />
    );
  };

  const monitorAddressPort = () => {
    if (member.monitor_address || member.monitor_port) {
      return `${member.monitor_address}:${member.monitor_port}`;
    }
  };

  Log.debug("RENDER NewMemberListItem");
  return (
    <tr>
      <td>
        <div className={shouldAlert() ? "text-danger" : ""}>
          {shouldAlert() ? (
            <span>
              <strong>{index}</strong>
            </span>
          ) : (
            <span>{index}</span>
          )}
        </div>
        {!member.saved && (
          <React.Fragment>
            <FormInput
              type="hidden"
              name={`member[${member.id}][identifier]`}
              value={member.id}
            />
            <FormInput
              type="hidden"
              name={`member[${member.id}][index]`}
              value={index}
            />
          </React.Fragment>
        )}
      </td>
      <td>
        {member.saved ? (
          <span>{displayName()}</span>
        ) : (
          <div className="display-flex member-required-icon">
            <MemberRequiredField />
            <FormInput
              name={`member[${member.id}][name]`}
              value={member.name}
            />
          </div>
        )}
      </td>
      <td>
        {member.saved ? (
          <div>
            <p className="list-group-item-text list-group-item-text-copy display-flex">
              <MemberIpIcon />
              {member.address}:{member.protocol_port}
            </p>
            {monitorAddressPort() && (
              <p className="list-group-item-text list-group-item-text-copy display-flex">
                <MemberMonitorIcon />
                {monitorAddressPort()}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="display-flex member-icon-in-input member-required-icon">
              <MemberRequiredField />
              <MemberIpIcon />
              <FormInput
                name={`member[${member.id}][address]`}
                value={member.address}
                disabled={member.edit}
                placeholder="Address"
                extraClassName="icon-in-input"
              />
              <span className="horizontal-padding-min">:</span>
              <FormInput
                type="number"
                name={`member[${member.id}][protocol_port]`}
                value={member.protocol_port}
                disabled={member.edit}
                placeholder="Port"
                size="md"
              />
            </div>
            <div className="display-flex member-icon-in-input margin-top">
              <MemberMonitorIcon />
              <FormInput
                name={`member[${member.id}][monitor_address]`}
                value={member.monitor_address}
                placeholder="Monitor Address"
                extraClassName="icon-in-input"
              />
              <span className="horizontal-padding-min">:</span>
              <FormInput
                type="number"
                name={`member[${member.id}][monitor_port]`}
                value={member.monitor_port}
                placeholder="Port"
                size="md"
              />
            </div>
          </>
        )}
      </td>
      <td>
        {member.saved ? (
          <span>{member.weight}</span>
        ) : (
          <div>
            <FormInput
              type="number"
              name={`member[${member.id}][weight]`}
              value={member.weight || 1}
            />
          </div>
        )}
      </td>
      <td>
        {member.saved ? (
          <React.Fragment>
            {member.backup ? (
              <i className="fa fa-check" />
            ) : (
              <i className="fa fa-times" />
            )}
          </React.Fragment>
        ) : (
          <div>
            <FormInput
              type="checkbox"
              name={`member[${member.id}][backup]`}
              value={member.backup}
            />
          </div>
        )}
      </td>
      <td>
        {member.saved ? (
          <StaticTags tags={member.tags} shouldPopover={true} />
        ) : (
          <div>
            <TagsInput
              name={`member[${member.id}][tags]`}
              initValue={member.tags}
            />
          </div>
        )}
      </td>
      <td className="centered">
        {onRemoveMember && (
          <React.Fragment>
            {!member.saved && (
              <Button bsStyle="link" onClick={onRemoveClick}>
                <i className="fa fa-minus-circle"></i>
              </Button>
            )}
          </React.Fragment>
        )}
      </td>
    </tr>
  );
};

export default NewMemberListItem;
