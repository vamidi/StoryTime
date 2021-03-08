using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync
{

	public class LocationEntrance : MonoBehaviour
	{
		[Header("Asset References")]
		[SerializeField] private PathSO entrancePath;

		public PathSO EntrancePath => entrancePath;
	}
}
