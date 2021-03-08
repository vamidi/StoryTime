using System;

namespace DatabaseSync.Binary
{
	public class TableRowInfo
	{
		public string ColumnName = "";
		public UInt32 ColumnID = UInt32.MaxValue;

		public override bool Equals(object obj)
		{
			TableRowInfo t = obj as TableRowInfo;
			if (t == null)
				return false;

			return Equals(t);
		}
		public bool Equals(TableRowInfo t)
		{
			if (t == null)
				return false;

			return ColumnName == t.ColumnName && ColumnID == t.ColumnID;
		}
		public bool Equals(string s)
		{
			return ColumnName == s;
		}
		public bool NotEquals(string columnName)
		{
			return ColumnName != columnName;
		}
		public bool NotEquals(uint columnId)
		{
			return ColumnID != columnId;
		}

		public override int GetHashCode()
		{
			return base.GetHashCode();
		}
	}
}
