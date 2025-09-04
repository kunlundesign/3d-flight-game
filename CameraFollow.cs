using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    public Transform target;
    public Vector3 offset = new Vector3(0, 2, -8);
    public float smoothSpeed = 0.15f;

    void LateUpdate()
    {
        if (target == null) return;
        Vector3 desiredPosition = target.position + target.TransformDirection(offset);
        transform.position = Vector3.Lerp(transform.position, desiredPosition, smoothSpeed);
        transform.rotation = Quaternion.Lerp(transform.rotation, target.rotation, smoothSpeed);
    }
}
