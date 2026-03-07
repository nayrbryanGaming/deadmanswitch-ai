// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title InheritanceVault
 * @dev DEADMANSWITCH AI – Autonomous Crypto Inheritance Protocol
 * This contract enables automated inheritance via Chainlink CRE.
 * Features: Owner-controlled pings, inactivity monitoring, and automated execution.
 */
contract InheritanceVault {
    address public owner;
    address public heir;
    address public automationRegistry;
    uint256 public lastPingTimestamp;
    uint256 public inactivityThreshold;
    
    // Using a uint256 for gas-optimized reentrancy guard
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    event HeirRegistered(address indexed heir, uint256 threshold);
    event Pinged(uint256 timestamp);
    event InheritanceExecuted(address indexed heir, uint256 amount);
    event Deposited(address indexed sender, uint256 amount);
    event AutomationSet(address indexed automation);

    modifier onlyOwner() {
        require(msg.sender == owner, "Direct access restricted to owner");
        _;
    }

    modifier onlyAutomation() {
        require(msg.sender == automationRegistry || msg.sender == owner, "Restricted to automation system");
        _;
    }

    modifier noReentrant() {
        require(_status != _ENTERED, "Reentrancy detected");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor() {
        owner = msg.sender;
        lastPingTimestamp = block.timestamp;
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Register a beneficiary and set inactivity threshold.
     */
    function registerHeir(address _heir, uint256 _threshold) external onlyOwner {
        require(_heir != address(0), "Invalid heir address");
        require(_threshold > 0, "Threshold must be > 0");
        heir = _heir;
        inactivityThreshold = _threshold;
        lastPingTimestamp = block.timestamp;
        emit HeirRegistered(_heir, _threshold);
    }

    /**
     * @dev Set the authorized automation system address (CRE/Chainlink).
     */
    function setAutomation(address _automation) external onlyOwner {
        require(_automation != address(0), "Invalid automation address");
        automationRegistry = _automation;
        emit AutomationSet(_automation);
    }

    /**
     * @dev Update the last ping timestamp to indicate activity.
     */
    function ping() external onlyOwner {
        lastPingTimestamp = block.timestamp;
        emit Pinged(block.timestamp);
    }

    /**
     * @dev Execute inheritance transfer if inactivity threshold is exceeded.
     * RESTRICTED: Callable ONLY by the automation system or owner.
     */
    function executeInheritance() external onlyAutomation noReentrant {
        require(heir != address(0), "Heir not registered");
        require(block.timestamp > lastPingTimestamp + inactivityThreshold, "Threshold not reached");

        uint256 balance = address(this).balance;
        require(balance > 0, "No funds available");

        // Use call pattern for safe ETH transfer
        (bool success, ) = heir.call{value: balance}("");
        require(success, "Transfer to heir failed");

        emit InheritanceExecuted(heir, balance);
    }

    /**
     * @dev Allows owner to deposit ETH. Updates activity status.
     */
    function deposit() external payable onlyOwner {
        lastPingTimestamp = block.timestamp;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Helper for UI to fetch critical state in one call.
     */
    function getStatus() external view returns (
        address _owner,
        address _heir,
        uint256 _lastPing,
        uint256 _threshold,
        uint256 _balance
    ) {
        return (owner, heir, lastPingTimestamp, inactivityThreshold, address(this).balance);
    }

    /**
     * @dev Fallback function to accept ETH. Updates activity status.
     */
    receive() external payable {
        if (msg.sender == owner) {
            lastPingTimestamp = block.timestamp;
        }
        emit Deposited(msg.sender, msg.value);
    }
}
