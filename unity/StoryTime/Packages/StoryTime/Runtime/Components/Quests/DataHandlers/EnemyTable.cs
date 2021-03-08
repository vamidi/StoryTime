using UnityEngine;

namespace DatabaseSync.Components
{
	using Binary;
	public class EnemyTable : BaseTable<EnemySO>
	{
		public new static EnemySO ConvertRow(TableRow row, EnemySO scriptableObject = null)
		{
			EnemySO enemy = scriptableObject ? scriptableObject : ScriptableObject.CreateInstance<EnemySO>();

			if (row.Fields.Count == 0)
			{
				return enemy;
			}

			foreach (var field in row.Fields)
			{
				if (field.Key.Equals("id"))
				{
					enemy.ID = uint.Parse(field.Value.Data);
				}

				if (field.Key.Equals("category"))
				{
					enemy.Category = (uint) field.Value.Data;
				}

				if (field.Key.Equals("name"))
				{
					enemy.EnemyName = (string) field.Value.Data;
				}
			}

			return enemy;
		}
	}
}
