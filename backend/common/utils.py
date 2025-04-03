import uuid
import platform
import hashlib


def generate_system_anonymous_information():
    # this function make a unique id by system info
    system_info = platform.uname()
    mac_address = uuid.getnode()  # Get MAC address
    cpu_info = platform.processor()

    # Concatenate system details
    raw_id = f"{system_info.system}-{system_info.node}-{system_info.release}-{system_info.version}-{system_info.machine}-{mac_address}-{cpu_info}"

    # Generate a unique hash
    unique_id = hashlib.sha256(raw_id.encode()).hexdigest()

    return {
        "os_name": truncate_text(platform.system(), 256),  # Windows, Linux, macOS
        "os_version": truncate_text(platform.version(), 256),  # OS version
        "os_release": truncate_text(
            platform.release(), 256
        ),  # Release name (e.g., "10" or "22.04")
        "architecture": truncate_text(platform.machine(), 256),  # x86_64, ARM
        "kernel_version": truncate_text(
            platform.uname().version, 256
        ),  # Kernel version
        "cpu_model": truncate_text(platform.processor(), 256),  # CPU info
        "unique_id": truncate_text(unique_id, 256),  # a unique ide
    }


def truncate_text(text, max_length):
    if len(text) > max_length:
        return text[:max_length]
    return text
