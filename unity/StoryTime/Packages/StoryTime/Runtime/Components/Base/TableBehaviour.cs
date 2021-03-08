using System;
using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync
{
    using Database;
    using Binary;

    public class TableBehaviour : ScriptableObject
    {
	    /// <summary>
	    /// ID of the row inside the table.
	    /// </summary>
	    public UInt32 ID
	    {
		    get => id;
		    set {
			    id = value;
			    OnTableIDChanged();
		    }
	    }

	    /// <summary>
	    /// Name of the table that we are using.
	    /// </summary>
	    public string Name { get => tableName; protected set => tableName = value; }

	    public string DropdownColumn { get => dropdownColumn; protected set => dropdownColumn = value; }

	    public string LinkedColumn { get => linkedColumn; protected set => linkedColumn = value; }
	    public UInt32 LinkedID { get => linkID; protected set => linkID = value; }

	    [SerializeField, HideInInspector]
	    private UInt32 id = UInt32.MaxValue;

	    [SerializeField, HideInInspector]
	    private string tableName = String.Empty;

	    [SerializeField, HideInInspector]
	    private string linkedColumn = String.Empty;

	    [SerializeField, HideInInspector]
	    private string dropdownColumn = String.Empty;

	    [SerializeField, HideInInspector]
	    private UInt32 linkID = UInt32.MaxValue;

		public TableBehaviour(string name, string dropdownColumn, string linkedColumn = "",
			UInt32 linkedId = UInt32.MaxValue)
	    {
		    Init(name, dropdownColumn, linkedColumn, linkedId);
	    }

	    public void Init(string name, string dropdownColumn, string linkedColumn, UInt32 linkedId)
	    {
		    Name = name;
		    DropdownColumn = dropdownColumn;

		    LinkedColumn = linkedColumn;
		    LinkedID = linkedId;
	    }

	    public TableField GetField(string tableName, string columnName, uint id)
	    {
		    return TableDatabase.Get.GetField(tableName, columnName, id);
	    }

	    public TableRow GetRow(string tableName, uint id)
	    {
		    return TableDatabase.Get.GetRow(tableName, id);
	    }

	    public Table GetTable(string tableName)
	    {
		    return TableDatabase.Get.GetTable(tableName);
	    }

	    public Tuple<uint, TableRow> FindLink(string tableName, string columnName, uint id)
	    {
		    return TableDatabase.Get.FindLink(tableName, columnName, id);
	    }

	    public List<Tuple<uint, TableRow>> FindLinks(string tableName, string columnName, UInt32 id)
	    {
		    return TableDatabase.Get.FindLinks(tableName, columnName, id);
	    }
	    public virtual void OnTableIDChanged()
	    {
		    TableDatabase.Get.Refresh();
	    }
    }
}
