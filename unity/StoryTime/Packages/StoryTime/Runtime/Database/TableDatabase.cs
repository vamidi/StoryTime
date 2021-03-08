using System;
using System.IO;
using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync.Database
{
    using Binary;

    /// <summary>
    /// TableDatabase stores table data from the json file and stores it into memory
    /// From memory everyone get fetch this instance and grab data
    /// </summary>
    public sealed class TableDatabase
    {
        // private UInt64 DatabaseVersion = 0;
        private const string DataPath = "Packages/com.unity.vamidicreations.storytime";

        /// <summary>
        /// All the data (sorted per table) the application needs for reading
        /// This data has the table data from the json files.
        /// ReSharper disable once InconsistentNaming
        /// </summary>
        private readonly Dictionary<string, Table> Data = new Dictionary<string, Table>();

        /// <summary>
        /// ReSharper disable once InconsistentNaming
        /// This variable has the actual data of the table
        /// </summary>
        private readonly Dictionary<string, TableBinary> _Binaries = new Dictionary<string, TableBinary>();

        // Explicit static constructor to tell C# compiler
        // not to mark type as before field init
        static TableDatabase() { }

        private TableDatabase()
        {
	        // locate the data folder
	        string dataLocation = $"{DataPath}/Data/";
	        if (!Directory.Exists(dataLocation))
	        {
		        Directory.CreateDirectory(dataLocation);
	        }
            // Get existing database files
            var filePaths = Directory.GetFiles(dataLocation,"*.json");

            foreach (var filePath in filePaths)
            {
	            string name = Path.GetFileNameWithoutExtension(filePath);
                _Binaries.Add(name, new TableBinary(name));
            }

            // Get database version
            // UpdateTime();
        }

        // Get the timestamp of the last synced database version
        // UInt64 GetDatabaseVersion() { return DatabaseVersion; }

        public static TableDatabase Get { get; } = new TableDatabase();

        public TableBinary GetBinary(string tableName)
        {
            if (!_Binaries.ContainsKey(tableName))
            {
                TableBinary bin = new TableBinary(tableName);
                _Binaries.Add(tableName, bin);
            }

            return _Binaries[tableName];
        }

        public List<Tuple<UInt32, TableRow>> FindLinks(string tableName, string columnName, UInt32 id)
        {
            List<Tuple<UInt32, TableRow>> result = new List<Tuple<uint, TableRow>>();

            Table table = GetTable(tableName);

            foreach(KeyValuePair<UInt32, TableRow> row in table.Rows)
            {
                foreach (KeyValuePair<TableRowInfo, TableField> field in row.Value.Fields)
                {
	                if (field.Key.NotEquals(columnName))
		                continue;

	                double d = field.Value.Data;
	                // memcpy(&d, field.Value.Data.Get(), FMath::Min((size_t)sizeof(double), (size_t)field.Value.Size));
	                if ((uint) d == id)
		                result.Add(new Tuple<uint, TableRow>(row.Key, row.Value));
                }
            }

            return result;
        }

        public /* const */ TableField GetField(string tableName, uint columnId, uint id)
        {
            TableRow row = GetRow(tableName, id);

            foreach (KeyValuePair<TableRowInfo, TableField> field in row.Fields)
            {
                if (field.Key.NotEquals(columnId))
                    continue;

                return field.Value;
            }

            return null;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="tableName"></param>
        /// <param name="columnName"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        public /* const */ TableField GetField(string tableName, string columnName, uint id)
        {
            TableRow row = GetRow(tableName, id);

            foreach (KeyValuePair<TableRowInfo, TableField> field in row.Fields)
            {
                if (field.Key.Equals(columnName))
                {
                    return field.Value;
                }
            }

            return null;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="row"></param>
        /// <param name="columnName"></param>
        /// <returns></returns>
        public TableField GetField(TableRow row, string columnName)
        {
	        foreach (KeyValuePair<TableRowInfo, TableField> field in row.Fields)
	        {
		        if (field.Key.Equals(columnName))
		        {
			        return field.Value;
		        }
	        }

	        return null;
        }

        /*Dictionary<uint, TableRow> GetRows(string tableName)
        {
            return GetTable(tableName).Rows;
        }*/

        /// <summary>
        ///
        /// </summary>
        /// <param name="tableName"></param>
        /// <param name="entityID"></param>
        /// <returns></returns>
        public TableRow GetRow(string tableName, uint entityID)
        {
            Table table = GetTable(tableName);
            if (!table.Rows.ContainsKey(entityID))
            {
                TableRow r = TableBinary.GetRow(tableName, entityID);
                table.Rows.Add(entityID, r);
                return table.Rows[entityID];
            }

            return table.Rows[entityID];
        }

        public Table GetTableById(string tableID)
        {
	        List<Table> tables = GetTables();
	        foreach (var table in tables)
	        {
		        if (table.id == tableID)
			        return table;
	        }

	        return null;
        }

        public Table GetTable(string tableName)
        {
            if (!Data.ContainsKey(tableName))
            {
                Data.Add(tableName, TableBinary.GetTable(tableName));
                return Data[tableName];
            }

            return Data[tableName];
        }

        public List<Table> GetTables()
        {
	        List<Table> tables = new List<Table>();
	        foreach (var kBinary in _Binaries)
	        {
		        tables.Add(GetTable(kBinary.Key));
	        }

	        return tables;
        }

        public Tuple<uint, TableRow> FindLink(string tableName, string columnName, uint id)
        {
            /* const */ Table table = GetTable(tableName);

            foreach (KeyValuePair<uint, TableRow> row in table.Rows)
            {
                foreach (KeyValuePair<TableRowInfo, TableField> field in row.Value.Fields)
                {
                    if (!field.Key.Equals(columnName))
                        continue;

                    if (field.Value.Size != 0)
                    {
                        double d = UInt32.MaxValue;
                        // memcpy(&d, field.Value.Data.Get(), FMath::Min((size_t)sizeof(double), (size_t)field.Value.Size));

                        if ((uint)d == id)
                            return new Tuple<uint, TableRow>(row.Key, row.Value);
                    }
                }
            }

            return new Tuple<uint, TableRow>(UInt32.MaxValue, null);
        }

        void RemoveCache()
        {
            // Data.Empty();

        }

        public void Refresh()
        {
            foreach (var binary in _Binaries)
            {
                binary.Value.Refresh();
            }

            RemoveCache();
            // UpdateTime();
        }
    }
}
