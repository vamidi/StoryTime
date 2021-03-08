using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace DatabaseSync.Binary
{
    public struct JsonEntry {
       public JTokenType Type;		// Column type
       public string Name;			// Column name
    }

    public struct JsonEntity
    {
	    public List<JsonEntry> Columns;		// Json data entries
    }

    public struct UJSON
    {
        public UInt64 Modified;					// Last modified timestamp
        public string Name;						// Table Name
        public UInt32 ColumnCount;				// Number of columns within the table
        public UInt32 EntityCount;				// Number of entities within the table

        public List<JsonEntry> JsonColumnEntries;		// Json data entries
    }
}
