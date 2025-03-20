import { Button, useDataProvider, useListContext, useNotify } from 'react-admin';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const ExportToExcelButton = ({ resource, referenceFields = {} }) => {
    const dataProvider = useDataProvider();
    const { filterValues, sort } = useListContext();
    const notify = useNotify();

    const handleExport = async () => {
        try {
            // Uploading data based on filters
            const { data } = await dataProvider.getList(resource, {
                pagination: { page: 1, perPage: 10000 },
                sort,
                filter: filterValues,
            });

            if (!data || data.length === 0) {
                notify("Нет данных для экспорта", { type: "warning" });
                return;
            }

            const referenceData = {};

            // Loading data from linked tables
            for (const field in referenceFields) {
                const { reference, replaceField } = referenceFields[field];

                const ids = [...new Set(data.flatMap(item => item[field] || []))];

                if (ids.length > 0) {
                    const { data: refData } = await dataProvider.getMany(reference, { ids });

                    referenceData[field] = refData.reduce((acc, item) => {
                        acc[item.id] = item[replaceField] || item.id;
                        return acc;
                    }, {});
                }
            }

            const exportData = data.map((item) => {
                const filteredItem = { ...item };

                // Excluding service fields
                delete filteredItem.deleted;
                delete filteredItem.__v;
                delete filteredItem._id;
                delete filteredItem.nfcId;
                delete filteredItem.password;
                delete filteredItem.attemptedUsers;


                for (const field in referenceData) {
                    if (filteredItem[field]) {
                        filteredItem[field] = Array.isArray(filteredItem[field])
                            ? filteredItem[field].map(id => referenceData[field][id] || id).join(", ")
                            : referenceData[field][filteredItem[field]] || filteredItem[field];
                    }
                }

                if (Array.isArray(filteredItem.deviceId)) {
                    filteredItem.deviceId = filteredItem.deviceId.join(", ");
                }

                return filteredItem;
            });

            // Generating and saving an Excel file
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Data");
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

            saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `${resource}_export.xlsx`);
            notify("Экспорт завершен", { type: "info" });

        } catch (error) {
            console.error("Ошибка экспорта:", error);
            notify(`Ошибка экспорта: ${error.message}`, { type: "warning" });
        }
    };

    return <Button style={{margin:"10px"}} label="Экспорт в Excel" onClick={handleExport} />;
};

export default ExportToExcelButton;