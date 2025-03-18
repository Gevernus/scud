import { useState, useEffect } from 'react';
import { ReferenceField, TextField, useRecordContext } from 'react-admin';
import createDataProvider from '../../dataProvider';

const dataProvider = createDataProvider(); 

const AttachedStationField = () => {
  const record = useRecordContext(); 
  const [hasStation, setHasStation] = useState(false);
  const [stationId, setStationId] = useState(null);

  useEffect(() => {
    if (record?.attachedStation) {
      dataProvider
        .getOne('stations', { id: record.attachedStation })
        .then(({ data }) => {
          if (data) {
            setHasStation(true);
            setStationId(record.attachedStation);
          }
        })
        .catch((error) => {
          console.error('Ошибка загрузки станции:', error);
          setHasStation(false);
        });
    } else {
      setHasStation(false);
    }
  }, [record]);

  return hasStation ? (
    <ReferenceField
      label="Привязка к станции"
      source="attachedStation"
      reference="stations"
      link="show"
    >
      <TextField source="name" />
    </ReferenceField>
  ) : (
    <span>Без привязки</span>
  );
};

export default AttachedStationField;
