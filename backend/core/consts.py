from django.utils.translation import gettext_lazy as _

OPTIONS_SCHEMA = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
        "page_options": {
            "type": "object",
            "properties": {
                "exclude_tags": {"type": "array", "items": {"type": "string"}},
                "include_tags": {"type": "array", "items": {"type": "string"}},
                "wait_time": {"type": "number"},
                "include_html": {"type": "boolean"},
                "only_main_content": {"type": "boolean"},
                "include_links": {"type": "boolean"},
                "ignore_rendering": {"type": "boolean"},
            },
        },
        "spider_options": {
            "type": "object",
            "properties": {
                "max_depth": {"type": "number"},
                "page_limit": {"type": "number"},
                "allowed_domains": {"type": "array", "items": {"type": "string"}},
                "exclude_paths": {"type": "array", "items": {"type": "string"}},
                "include_paths": {"type": "array", "items": {"type": "string"}},
            },
        },
        "map_options": {"type": "object", "properties": {}},
    },
}

CRAWL_STATUS_NEW = "new"
CRAWL_STATUS_RUNNING = "running"
CRAWL_STATUS_FINISHED = "finished"
CRAWL_STATUS_CANCELING = "canceling"
CRAWL_STATUS_CANCELED = "canceled"
CRAWL_STATUS_FAILED = "failed"

CRAWL_STATUS_CHOICES = (
    (CRAWL_STATUS_NEW, _("New")),
    (CRAWL_STATUS_RUNNING, _("Running")),
    (CRAWL_STATUS_FINISHED, _("Finished")),
    (CRAWL_STATUS_CANCELING, _("Canceling")),
    (CRAWL_STATUS_CANCELED, _("Canceled")),
    (CRAWL_STATUS_FAILED, _("Failed")),
)

IGNORE_FILE_TYPES = [
    # Text file extensions
    "txt",  # Plain text file
    "doc",  # Microsoft Word document
    "docx",  # Microsoft Word Open XML document
    "pdf",  # Portable Document Format
    "odt",  # OpenDocument Text Document
    "rtf",  # Rich Text Format
    # Data file extensions
    "csv",  # Comma-Separated Values
    "xls",  # Microsoft Excel Spreadsheet
    "xlsx",  # Microsoft Excel Open XML Spreadsheet
    "ods",  # OpenDocument Spreadsheet
    "json",  # JavaScript Object Notation
    "xml",  # Extensible Markup Language
    "sql",  # SQL database file
    "db",  # Database file
    "sqlite",  # SQLite database file
    "log",  # Log file
    # Image file extensions
    "jpg",  # JPEG image
    "jpeg",  # JPEG image
    "png",  # Portable Network Graphics
    "gif",  # Graphics Interchange Format
    "bmp",  # Bitmap image
    "svg",  # Scalable Vector Graphics
    "tif",  # Tagged Image File Format
    "tiff",  # Tagged Image File Format
    "webp",  # Web Picture format
    # Audio file extensions
    "mp3",  # MP3 audio
    "wav",  # Waveform Audio
    "flac",  # Free Lossless Audio Codec
    "aac",  # Advanced Audio Codec
    "ogg",  # Ogg Vorbis
    "m4a",  # MPEG-4 Audio
    # Video file extensions
    "mp4",  # MPEG-4 Video
    "avi",  # Audio Video Interleave
    "mov",  # Apple QuickTime Movie
    "wmv",  # Windows Media Video
    "mkv",  # Matroska Video
    "flv",  # Flash Video
    "webm",  # Web Media File
    # Compressed file extensions
    "zip",  # Zip archive
    "rar",  # RAR archive
    "7z",  # 7-Zip archive
    "tar",  # TAR archive
    "gz",  # Gzip compressed file
    "iso",  # Disc Image file
    # Executable file extensions
    ".exe",  # Windows executable file
    ".bat",  # Batch file
    ".sh",  # Shell script
    ".msi",  # Microsoft Installer
    ".apk",  # Android Package
    ".app",  # macOS Application
    # Programming and script file extensions
    ".py",  # Python script
    ".css",  # Cascading Style Sheets
    ".js",  # JavaScript
    ".java",  # Java Source Code
    ".c",  # C Source Code
    ".cpp",  # C++ Source Code
    ".h",  # C/C++ Header File
    ".ts",  # TypeScript
    ".swift",  # Swift Source Code
    ".go",  # Go Source Code
    ".rb",  # Ruby Script
    # Config file extensions
    ".ini",  # Initialization file
    ".conf",  # Configuration file
    ".yaml",  # YAML Ain't Markup Language
    ".yml",  # YAML Ain't Markup Language
    ".env",  # Environment variables file
    ".cfg",  # Configuration file
    # Web file extensions
    ".css",  # Cascading Style Sheets
    ".js",  # JavaScript
    ".php",  # PHP script
    ".asp",  # Active Server Pages
    ".aspx",  # Active Server Pages
    ".jsp",  # Java Server Pages
    # 3D modeling and CAD file extensions
    ".stl",  # Stereolithography
    ".obj",  # 3D Object file
    ".fbx",  # Autodesk FBX
    ".dwg",  # AutoCAD Drawing
    ".dxf",  # Drawing Exchange Format
    # Other common file extensions
    ".eps",  # Encapsulated PostScript
    ".psd",  # Photoshop Document
    ".ai",  # Adobe Illustrator file
    ".ppt",  # PowerPoint presentation
    ".pptx",  # PowerPoint Open XML presentation
    ".key",  # Apple Keynote presentation
    ".icns",  # Icon file for macOS
    ".ico",  # Icon file for Windows
]

CRAWL_RESULT_ATTACHMENT_TYPE_PDF = "pdf"
CRAWL_RESULT_ATTACHMENT_TYPE_SCREENSHOT = "screenshot"

CRAWL_RESULT_ATTACHMENT_TYPE_CHOICES = (
    (CRAWL_RESULT_ATTACHMENT_TYPE_PDF, _("PDF")),
    (CRAWL_RESULT_ATTACHMENT_TYPE_SCREENSHOT, _("Screenshot")),
)

SEARCH_TYPE_WEB = "web"

SEARCH_TYPE_CHOICES = ((SEARCH_TYPE_WEB, _("Web")),)

SEARCH_DEPTH_BASIC = "basic"
SEARCH_DEPTH_ADVANCED = "advanced"
SEARCH_DEPTH_ULTIMATE = "ultimate"

SEARCH_DEPTH_CHOICES = (
    (SEARCH_DEPTH_BASIC, _("Basic")),
    (SEARCH_DEPTH_ADVANCED, _("Advanced")),
    (SEARCH_DEPTH_ULTIMATE, _("Ultimate")),
)

SEARCH_TIME_RANGE_ANY = "any"
SEARCH_TIME_RANGE_DAY = "day"
SEARCH_TIME_RANGE_WEEK = "week"
SEARCH_TIME_RANGE_MONTH = "month"
SEARCH_TIME_RANGE_YEAR = "year"

SEARCH_TIME_RANGE_CHOICES = (
    (SEARCH_TIME_RANGE_ANY, _("Any")),
    (SEARCH_TIME_RANGE_DAY, _("Day")),
    (SEARCH_TIME_RANGE_WEEK, _("Week")),
    (SEARCH_TIME_RANGE_MONTH, _("Month")),
    (SEARCH_TIME_RANGE_YEAR, _("Year")),
)

PROXY_TYPE_HTTP = "http"
PROXY_TYPE_SOCKS4 = "socks4"
PROXY_TYPE_SOCKS5 = "socks5"

PROXY_TYPE_CHOICES = (
    ("http", _("HTTP")),
    ("socks4", _("SOCKS4")),
    ("socks5", _("SOCKS5")),
)

PROXY_CATEGORY_GENERAL = "general"
PROXY_CATEGORY_PREMIUM = "premium"
PROXY_CATEGORY_TEAM = "team"

PROXY_CATEGORY_CHOICES = (
    (PROXY_CATEGORY_GENERAL, _("General")),
    (PROXY_CATEGORY_PREMIUM, _("Premium")),
    (PROXY_CATEGORY_TEAM, _("Team")),
)

CRAWL_TYPE_SINGLE = "single"
CRAWL_TYPE_BATCH = "batch"

CRAWL_TYPE_CHOICES = (
    (CRAWL_TYPE_SINGLE, _("Single")),
    (CRAWL_TYPE_BATCH, _("Batch")),
)
