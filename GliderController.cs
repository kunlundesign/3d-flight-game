using UnityEngine;

public class GliderController : MonoBehaviour
{
    public float speed = 20f;
    public float turnSpeed = 50f;
    public float pitchSpeed = 30f;
    public float rollSpeed = 40f;
    public Rigidbody rb;

    void Start()
    {
        if (rb == null)
            rb = GetComponent<Rigidbody>();
        rb.useGravity = false;
    }

    void Update()
    {
        // Forward movement
        rb.velocity = transform.forward * speed;

        // Yaw (left/right)
        float yaw = Input.GetAxis("Horizontal") * turnSpeed * Time.deltaTime;
        // Pitch (up/down)
        float pitch = -Input.GetAxis("Vertical") * pitchSpeed * Time.deltaTime;
        // Roll (Q/E)
        float roll = 0f;
        if (Input.GetKey(KeyCode.Q)) roll = rollSpeed * Time.deltaTime;
        if (Input.GetKey(KeyCode.E)) roll = -rollSpeed * Time.deltaTime;

        // Apply rotation
        transform.Rotate(pitch, yaw, roll, Space.Self);
    }
}
