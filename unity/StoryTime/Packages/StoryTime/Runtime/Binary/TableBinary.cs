using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;

#if UNITY_EDITOR
using UnityEditor;
#endif

using Newtonsoft.Json.Linq;

namespace DatabaseSync.Binary
{
	/// <summary>
	/// @Reference
	/// </summary>
	/** JObject o = JObject.FromObject(new
	{
	 	channel = new
	 	{
	 		title = "James Newton-King",
	 		link = "http://james.newtonking.com",
	 		description = "James Newton-King's blog.",
	 		item =
	 			from p in posts
	 			orderby p.Title
	 			select new
	 			{
	 				title = p.Title,
	 				description = p.Description,
	 				link = p.Link,
	 				category = p.Categories
	 			}
	 	}
	 });
	*/

	struct TableStruct
	{
		public Table Table;
		public UJSON Ujson;
		public List<TableField> Data;
	}

	public class TableBinary
	{
		/// <summary>
		/// This is the name of the table
		/// </summary>
		private readonly string _tableName;

		/// <summary>
		/// This container contains all the data we need to get the right column
		/// </summary>
		private UJSON _ujson = new UJSON
		{
			JsonColumnEntries = new List<JsonEntry>()
		};

		// Size followed by actual data
		private List<TableField> _data = new List<TableField>();

		private bool _listUpdated;
		private string _shownColumn;

		private readonly Dictionary<uint, string> _list = new Dictionary<uint, string>();
		private readonly DatabaseConfig m_ConfigFile;

		public static DatabaseConfig Fetch()
		{
			var path = EditorPrefs.GetString("DatabaseSync-Window-Settings-Config", "");
			var configFile = AssetDatabase.LoadAssetAtPath<DatabaseConfig>(AssetDatabase.GUIDToAssetPath(path));
			if (configFile == null)
				throw new ArgumentNullException($"{nameof(configFile)} must not be null.", nameof(configFile));

			return configFile;
		}

		/// <summary>
		/// constructor
		/// </summary>
		/// <param name="sName"></param>
		public TableBinary(string sName)
		{
			_tableName = sName;

			// set the right path
			m_ConfigFile = Fetch();

			// Retrieve data from existing file, if it exists
			Refresh();
		}

		/**
		 *
		 */
		public static Table GetTable(string tableName)
		{
			DatabaseConfig config = Fetch();
			string destination = $"{config.dataPath}/{tableName}.json";

			if (!File.Exists(destination))
				throw new ArgumentException($"{tableName} couldn't be found!");

			var stru = new TableStruct
			{
				Table = new Table(),
				Ujson =
				{
					JsonColumnEntries = new List<JsonEntry>()
				},
				Data = new List<TableField>()
			};

			var table = ParseData(GetTableData(GetStream(destination)), ref stru);
			return table;
		}

		public static TableRow GetRow(string tableName, uint entityID)
		{
			DatabaseConfig config = Fetch();
			string destination = $"{config.dataPath}/{tableName}.json";
			if (!File.Exists(destination))
			{
				throw new ArgumentException($"{tableName} couldn't be found!");
			}

			string jsonString = GetStream(destination);
			JToken tableData = GetTableData(jsonString);

			// The key-value data
			JArray arr = tableData["data"].Value<JArray>();
			TableRow result = new TableRow();

			// Invalid ID
			if (entityID >= arr.Count)
			{
				Debug.LogWarning($"EntityID: {entityID} does not exist!");
				return new TableRow();
			}

			var rowProperties = arr[(int)entityID].Children<JProperty>();
			uint i = 0;
			foreach (var entity in rowProperties)
			{
				TableField field = new TableField();

				switch (entity.Value.Type)
				{
					case JTokenType.Boolean:
						field.Data = entity.Value.ToObject<bool>();
						// Debug.Log("Bool");
						break;
					case JTokenType.Integer:
						field.Data = entity.Value.ToObject<double>();
						// Debug.Log("Number");
						break;
					case JTokenType.String:
						field.Data = entity.Value.ToObject<string>();
						// Debug.Log("String");
						break;
					case JTokenType.Object:
						field.Data = entity.Value.ToObject<JObject>();
						break;
				}

				result.Fields.Add(new TableRowInfo{ ColumnName = entity.Name, ColumnID = i }, field);
				i++;
			}

			return result;
		}

		public TableField GetValue(string tableName, uint columnID, uint entityID)
		{
			string destination = $"{m_ConfigFile.dataPath}/{tableName}.json";
			if (!File.Exists(destination))
			{
				throw new ArgumentException($"{tableName} couldn't be found!");
			}

			string jsonString = GetStream(destination);
			JArray arr = JArray.Parse(jsonString);
			TableField result = new TableField();

			// Invalid ID
			if (entityID < 0 || entityID >= arr.Count)
			{
				return new TableField();
			}

			var rowProperties = arr[(int)entityID].Children<JProperty>();
			uint i = 0;
			foreach (var entity in rowProperties)
			{
				if(i != columnID)
					continue;

				switch (entity.Value.Type)
				{
					case JTokenType.Boolean:
						result.Data = entity.Value.ToObject<bool>();
						break;
					case JTokenType.Integer:
						result.Data = entity.Value.ToObject<double>();
						break;
					case JTokenType.String:
						result.Data = entity.Value.ToObject<string>();
						break;
					case JTokenType.Object:
						result.Data = entity.Value.ToObject<JObject>();
						break;
				}

				Debug.Log(result.Data);
				i++;
			}

			return result;
		}

		public uint GetColumnID(string columnName)
		{
			string cName = columnName;

			for (uint j = 0; j < _ujson.ColumnCount; ++j)
			{
				if (String.CompareOrdinal(_ujson.JsonColumnEntries[(int)j].Name, cName) == 0)
					return j;
			}

			return uint.MaxValue;
		}

		public string GetColumnName(uint columnId)
		{
			// if (columnId > m_UDAT.ColumnCount)
			// return "";

			// return UTF8_TO_TCHAR(m_UDAT.CSCT.Entries[columnId].Name.c_str());
			return "";
		}

		public void Refresh()
		{
			// Load the table if exists
			string destination = $"{m_ConfigFile.dataPath}/{_tableName}.json";

			if (!File.Exists(destination))
			{
				return;
			}

			// clear out existing data
			_data.Clear();

			var stream = GetStream(destination);
			var token = GetTableData(stream);
			var stru = new TableStruct
			{
				Table = new Table(),
				Ujson = _ujson,
				Data = _data
			};

			ParseData(token, ref stru);

			_ujson = stru.Ujson;
			_data = stru.Data;
		}

		/// <summary>
		///
		/// </summary>
		/// <param name="columnToShow"></param>
		/// <param name="linkedColumn"></param>
		/// <param name="linkedId"></param>
		/// <returns></returns>
		public Dictionary<uint, string> PopulateWithLink(string columnToShow, string linkedColumn, uint linkedId)
        {
            Dictionary<uint, string> newList = Populate(columnToShow);
            uint uiLinkedID = linkedColumn != "" ? GetColumnID(linkedColumn) : uint.MaxValue;

            // Remove if not linked
            if (uiLinkedID != uint.MaxValue && linkedColumn != "")
            {
                List<uint> keys = new List<uint>(newList.Keys);

                foreach (uint key in keys)
                {
                    TableField field = GetValue(_tableName, uiLinkedID, key);

                    double d = field.Data;
                    // memcpy(&d, Field.Data.Get(), Field.Size);

                    if ((uint)d != linkedId)
                        newList.Remove(key);
                }

                // NewList.Compact();
            }

            return newList;
        }

		/// <summary>
		/// Generate a list with columns from the JSON data
		/// </summary>
		/// <param name="columnToShow"></param>
		/// <returns></returns>
        public Dictionary<uint, string> Populate(string columnToShow)
        {
	        if (_shownColumn == columnToShow && !_listUpdated)
            {
                return _list;
            }

            _listUpdated = false;
            _shownColumn = columnToShow;

            uint uiColumnID = GetColumnID(columnToShow);

            for (uint i = 0; i < _ujson.EntityCount; ++i)
            {
	            // if (!_UJSON.DSCT.Pointers[i])
                // {
                //     _list.Remove(i);
                //     continue;
                // }

                string d = "";
                if (uiColumnID == uint.MaxValue)
	                d = i.ToString();
                else
	                d += $"[{i}] {_data[(int) (i * _ujson.ColumnCount + uiColumnID)].Data}";

                // override if already exists
                if (_list.ContainsKey(i))
	                _list[i] = d;
                else
	                _list.Add(i, d);
            }

            return _list;
        }

		/// <summary>
		/// Import the JSON data and read from it.
		/// </summary>
		/// <param name="jsonTableData"></param>
		public void Import(JToken jsonTableData)
		{
			_listUpdated = true;

			// Get highest ID
			uint highestID = 0;

			if (jsonTableData["id"] == null || jsonTableData["data"] == null || jsonTableData["metadata"] == null)
				throw new ArgumentException("JSON does not contains the property id, data or metadata");

			if (m_ConfigFile == null)
				throw new ArgumentException("Database Config file could not be found");

			// The key-value data
			JObject entries = jsonTableData["data"].Value<JObject>();
			// The metadata from the json stream
			JObject metaData = jsonTableData["metadata"].Value<JObject>();

			// set the count of the amount of entities in the json
			_ujson.EntityCount = (uint)entries.Count;

			// {"Sellable":true,"created_at":1594979553,"deleted":false,"effectPrimaryValue":0,"effectTypeId":0,"name":"","sellValue":0,"updated_at":1594979553}

			// Check change in column
			// _UJSON.Entries = new List<JSONEntry>((int)_UJSON.EntityCount);

			JArray children = new JArray();

			int i = 0;
			foreach (var row in entries)
			{
				JObject entity = row.Value.ToObject<JObject>();
				// UInt32 j = UInt32.Parse(r.Key) * _UJSON.ColumnCount;

				highestID = (uint)Mathf.Max(highestID, uint.Parse(row.Key));

				foreach (var column in entity)
				{
					TableField field = new TableField();

					switch (column.Value.Type)
					{
						case JTokenType.Boolean:
							field.Data = column.Value.ToObject<bool>();
							// Debug.Log("Bool");
							break;
						case JTokenType.Integer:
							field.Data = column.Value.ToObject<double>();
							// Debug.Log("Number");
							break;
						case JTokenType.String:
							field.Data = column.Value.ToObject<string>();
							// Debug.Log("String");
							break;
						case JTokenType.Object:
							field.Data = column.Value.ToObject<JObject>();
							break;
					}

					if (i == 0)
					{
						// Set the amount of columns existing in all the entities
						_ujson.ColumnCount = (uint)entity.Count;

						JsonEntry entry = new JsonEntry {Name = column.Key, Type = column.Value.Type};
						_ujson.JsonColumnEntries.Add(entry);

						// We need to story all the data in one large array
						// _ujson.JsonColumnEntries.Capacity = (int)(_ujson.ColumnCount * _ujson.EntityCount);
					}
				}

				children.Add(row.Value);
				i++;
			}

			// Set data
			_ujson.EntityCount = (uint)Mathf.Max(
				_ujson.EntityCount,
				Mathf.Max((uint)entries.Count, highestID + 1)
			);

			Export(JObject.FromObject(new
			{
				id = jsonTableData["id"],
				metadata = metaData,
				data = children,
			}));
		}

		/// <summary>
        /// Get the stream from the json file
        /// </summary>
        /// <param name="destination"></param>
        /// <returns></returns>
        private static string GetStream(string destination)
        {
	        StreamReader reader = new StreamReader(destination);
	        string jsonString = reader.ReadToEnd();
	        reader.Close();

	        return jsonString;
        }

        /// <summary>
        /// Parse the JSON string to a JSON token that can be read from.
        /// </summary>
        /// <param name="jsonString"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentException"></exception>
        private static JToken GetTableData(string jsonString)
        {
	        JToken tableData = JToken.Parse(jsonString);
	        if (tableData["id"] == null || tableData["data"] == null || tableData["metadata"] == null)
		        throw new ArgumentException("JSON does not contains the property id, data or metadata");

	        return tableData;
        }

        /// <summary>
        /// The table data is read from the JSON token and then inserted
        /// in the table struct.
        /// </summary>
        /// <param name="tableData"></param>
        /// <param name="tableStruct"></param>
        /// <returns></returns>
        private static Table ParseData(JToken tableData, ref TableStruct tableStruct)
        {
	        tableStruct.Table.id = tableData["id"]?.ToObject<string>();
	        tableStruct.Table.metadata = tableData["metadata"]?.ToObject<TableMetaData>();

	        JArray entities = tableData["data"].Value<JArray>();

	        // set the count of the amount of entities in the json
	        tableStruct.Ujson.EntityCount = (uint)entities.Count;

	        uint i = 0;
	        // Loop through all the entities
	        foreach (var el in entities)
	        {
		        var rowParameters = el.Children<JProperty>();
		        TableRow tblRow = new TableRow();

		        if (i == 0)
		        {
			        // Set the amount of columns existing in all the entities
			        tableStruct.Ujson.ColumnCount = (uint)rowParameters.Count();

			        // We need to story all the data in one large array
			        // _ujson.JsonColumnEntries.Capacity = (int)(_ujson.ColumnCount * _ujson.EntityCount);
		        }

		        uint j = 0;
		        foreach (var entity in rowParameters)
		        {
			        TableField field = new TableField();

			        switch (entity.Value.Type)
			        {
				        case JTokenType.Boolean:
					        field.Data = entity.ToObject<bool>();
					        // Debug.Log("Bool");
					        break;
				        case JTokenType.Integer:
					        field.Data = entity.Value.ToObject<double>();
					        // Debug.Log("Number");
					        break;
				        case JTokenType.String:
					        field.Data = entity.Value.ToObject<string>();
					        // Debug.Log("String");
					        break;
				        case JTokenType.Object:
					        field.Data = entity.Value.ToObject<JObject>();
					        break;
			        }

			        // From there we need store the entries
			        JsonEntry entry = new JsonEntry { Name = entity.Name, Type = entity.Value.Type };
			        tableStruct.Ujson.JsonColumnEntries.Add(entry);
			        tableStruct.Data.Add(field);

			        // Add the field to the table row as well.
			        tblRow.Fields.Add(new TableRowInfo{ ColumnName = entity.Name, ColumnID = j }, field);
			        j++;
		        }
		        tableStruct.Table.Rows.Add(i, tblRow);
		        i++;
	        }

	        return tableStruct.Table;
        }

        /// <summary>
        /// Export the JSON token to a json file in the Data folder.
        /// </summary>
        /// <param name="exportObj"></param>
        private void Export(JToken exportObj)
        {
	        string destination = $"{m_ConfigFile.dataPath}/{_tableName}.json";

			if (!Directory.Exists(m_ConfigFile.dataPath))
				Directory.CreateDirectory(m_ConfigFile.dataPath);

			File.WriteAllText(destination, exportObj.ToString());
		}
	}
}
