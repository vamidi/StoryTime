using System;
using DatabaseSync.Binary;

public abstract class BaseTableHandler<T> : UnityEditor.MonoScript where T : DatabaseSync.TableBehaviour
{
	public static UnityEditor.MonoScript ConvertRow(TableRow row, T scriptableObject = null)
	{
		throw new ArgumentException("Row can't be converted. Make a new class that inherits from this class");
	}
}
