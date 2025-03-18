import { ReferenceField, TextField, useRecordContext } from 'react-admin';

const AttachedStationField = () => {
  const record = useRecordContext();

  if (!record || !record.attachedStation) {
    return <span>Без привязки</span>;
  }

  return (
    <ReferenceField
      label="Привязана к станции"
      source="attachedStation"
      reference="stations"
      link="show"
    >
      <TextField source="name" />
    </ReferenceField>
  );
};

export default AttachedStationField;
