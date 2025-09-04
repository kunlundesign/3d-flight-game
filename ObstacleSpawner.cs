using UnityEngine;

public class ObstacleSpawner : MonoBehaviour
{
    public GameObject[] obstaclePrefabs;
    public int obstacleCount = 50;
    public float spawnRadius = 500f;
    public float minY = 0f;
    public float maxY = 100f;

    void Start()
    {
        for (int i = 0; i < obstacleCount; i++)
        {
            Vector3 pos = new Vector3(
                Random.Range(-spawnRadius, spawnRadius),
                Random.Range(minY, maxY),
                Random.Range(-spawnRadius, spawnRadius)
            );
            int prefabIndex = Random.Range(0, obstaclePrefabs.Length);
            Instantiate(obstaclePrefabs[prefabIndex], pos, Quaternion.identity);
        }
    }
}
