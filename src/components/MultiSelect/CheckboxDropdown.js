import { observer } from "mobx-react-lite";

import React, { useEffect, useRef, useState } from "react";

import { Dropdown, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const CHECKBOX_STATES = {
    Checked: 'Checked',
    Indeterminate: 'Indeterminate',
    Empty: 'Empty',
};

const CheckboxMenu = React.forwardRef (
    (
        {
            children,
            style,
            className,
            "aria-labelledby": labeledBy,
            onChange,
            id,
            checkedItems,
            items,
            value,
            allChecked,
            selectAllId,
        },
        ref
    ) => {
        return (
            <div
                ref={ ref }
                style={ style }
                className={ `${ className } CheckboxMenu` }
                aria-labelledby={ labeledBy }
                id={ id }
            >
                <div
                    className="d-flex flex-column"
                    style={ { maxHeight: "calc(100vh)", overflow: "none" } }
                >
                    <div className="dropdown-item  dropdown-select-all border-bottom pt-2 pb-2">
                        <SelectAllCheckbox
                            value={ allChecked }
                            selectAllId={ selectAllId }
                            onChange={ onChange }
                        />
                    </div>
                    <ul
                        className="list-unstyled flex-shrink mb-0"
                        style={ { overflow: "auto" } }
                    >
                        { children }
                    </ul>

                </div>
            </div>
        );
    }
);

const SelectAllCheckbox = ( { value, onChange, selectAllId } ) => {
    const { t } = useTranslation ();
    const checkboxRef = useRef ();
    const labelValue = t ( "Select All" );
    const [ elValue, setElValue ] = useState ( value.toString () );


    const changeValue = ( value ) => {
        if ( value === CHECKBOX_STATES.Checked ) {
            checkboxRef.current.checked = true;
            checkboxRef.current.indeterminate = false;
        } else if ( value === CHECKBOX_STATES.Empty ) {
            checkboxRef.current.checked = false;
            checkboxRef.current.indeterminate = false;
        } else if ( value === CHECKBOX_STATES.Indeterminate ) {
            checkboxRef.current.checked = false;
            checkboxRef.current.indeterminate = true;
        }
        setElValue ( value )
    }


    useEffect ( () => {
        changeValue ( value );
    }, [ value ] );

    return (
        <Form.Check
            type="checkbox"
            value={ elValue }
            ref={ checkboxRef }
            label={ labelValue }
            id={ selectAllId }
            className={ "custom-werfen-checkbox-group" }
            onChange={ onChange && onChange.bind ( onChange, selectAllId ) }
        />
    )
}

const CheckDropdownItem = React.forwardRef (
    ( { children, id, onChange, checked }, ref ) => {
        return (
            <Form.Group ref={ ref } className=" dropdown-item mb-0" controlId={ id }>
                <Form.Check
                    type="checkbox"
                    label={ children }
                    checked={ checked }
                    onChange={ onChange && onChange.bind ( onChange, id ) }
                    className={ "custom-werfen-checkbox" }
                />
            </Form.Group>
        );
    }
);

export const CheckboxDropdown = observer ( ( { clearAll, items, title, callback, value } ) => {
    const checkboxRef = React.useRef ();
    const checkedItems = items.filter ( i => ( i.checked === true ) );
    const [ selectAllChecked, setSelectAllChecked ] = useState ( CHECKBOX_STATES.Empty )
    const [ dropdownClearAll, setDropdownClearAll ] = useState ( false );
    const handleChecked = ( key, event ) => {
        items.find ( i => i.id === key ).checked = event.target.checked;
        let updatedChecked = "";
        let result = "";
        switch ( true ) {
            case( checkedItems.length > 0 && checkedItems.filter ( ( checkedItem ) => checkedItem.id === key ).length === 1 ):
                const resultAfterResting = checkedItems.filter ( i => ( i.id !== key ) ).map ( ( el ) => el.id );
                result = resultAfterResting.length > 0 ? resultAfterResting : [ "all" ];
                updatedChecked = resultAfterResting.length > 0 ? CHECKBOX_STATES.Indeterminate : CHECKBOX_STATES.Empty
                break;
            case( checkedItems.length > 0 && checkedItems.filter ( ( checkedItem ) => checkedItem.id === key ).length === 0 ):
                const checkedItemsIds = checkedItems.map ( ( el ) => el.id );
                result = [ ...checkedItemsIds, event.target.id ];
                updatedChecked = result.length === items.length ? CHECKBOX_STATES.Checked : CHECKBOX_STATES.Indeterminate
                break;
            default:
                result = [ event.target.id ]
                updatedChecked = CHECKBOX_STATES.Indeterminate;
                break;
        }
        setSelectAllChecked ( updatedChecked );
        callback ( result );
    };
    useEffect ( () => {
        setDropdownClearAll ( clearAll );
    }, [ clearAll ] )

    useEffect ( () => {
        if ( value === "all" && dropdownClearAll ) {
            items.forEach ( i => ( i.checked = false ) );
            setSelectAllChecked ( CHECKBOX_STATES.Empty );
            setDropdownClearAll ( false );
        }
    }, [ dropdownClearAll ] )


    const handleSelectAll = () => {
        let updatedChecked;
        if ( checkedItems.length === items.length ) {
            items.forEach ( i => ( i.checked = false ) );
            updatedChecked = CHECKBOX_STATES.Empty;
        } else {
            items.forEach ( i => ( i.checked = true ) );
            updatedChecked = CHECKBOX_STATES.Checked;
        }
        setSelectAllChecked ( updatedChecked )
        callback ( 'all' );
    };



    return (
        <Dropdown className="custom-werfen-dropdown">

            <Dropdown.Toggle variant="primary" id="dropdown-basic">
                { title }
            </Dropdown.Toggle>

            <Dropdown.Menu
                as={ CheckboxMenu }
                onChange={ handleSelectAll }
                checkedItems={ checkedItems }
                allChecked={ selectAllChecked }
                selectAllId={ "selectAllId" }
                ref={ checkboxRef }
                value={ value }
                items={ items }
            >
                {
                    items.map ( ( i ) => (
                        <Dropdown.Item
                            key={ i.id }
                            as={ CheckDropdownItem }
                            id={ i.id }
                            checked={ i.checked !== undefined ? i.checked : false }
                            onChange={ handleChecked }
                            callback={ callback }
                        >
                            { i.value }
                        </Dropdown.Item>
                    ) ) }
            </Dropdown.Menu>
        </Dropdown>
    );
} );
