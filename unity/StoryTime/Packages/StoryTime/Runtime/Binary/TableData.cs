using System;
using System.Collections.Generic;

namespace DatabaseSync.Binary
{
    public class TableMetaData
    {
	    // ReSharper disable once InconsistentNaming
        public long created_at = 0;

        // ReSharper disable once InconsistentNaming
        public bool deleted = false;

        // ReSharper disable once InconsistentNaming
        public string description = "";

        // ReSharper disable once InconsistentNaming
        public uint lastUID = 0;

        // public bool private = false;

        // ReSharper disable once InconsistentNaming
        public string title = "";

        // ReSharper disable once InconsistentNaming
        public long updated_at = 0;
    }

    public class Table
    {
	    // ReSharper disable once InconsistentNaming
	    public string id = "";

	    // ReSharper disable once InconsistentNaming
	    public string projectID = "";

	    // ReSharper disable once InconsistentNaming
	    public TableMetaData metadata = new TableMetaData();

        public Dictionary<UInt32, TableRow> Rows = new Dictionary<UInt32, TableRow>();
    }
}
